import os
import dateutil.parser
import db

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token, create_refresh_token,
    jwt_refresh_token_required, get_jwt_identity
)

app = Flask(__name__)
CORS(app)
db.init_app(app)
    
# Setup the Flask-JWT-Extended extension
app.config['JWT_SECRET_KEY'] = 'cda79054-8b47-4c98-adfc-c59be5451af8'
jwt = JWTManager(app)



upload_username = os.environ['UPLOAD_USERNAME']
upload_password = os.environ['UPLOAD_PASSWORD']

# Provide a method to create access tokens. The create_access_token()
# function is used to actually generate the token, and you can return
# it to the caller however you choose.
@app.route('/login', methods=['POST'])
def login():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400

    username = request.json.get('username', None)
    password = request.json.get('password', None)
    if not username:
        return jsonify({"msg": "Missing username parameter"}), 400
    if not password:
        return jsonify({"msg": "Missing password parameter"}), 400

    if username != upload_username or password != upload_password:
        return jsonify({"msg": "Bad username or password"}), 401

    # Identity can be any data that is json serializable
    #access_token = create_access_token(identity=username)
    #return jsonify(access_token=access_token), 200
    # Use create_access_token() and create_refresh_token() to create our
    # access and refresh tokens
    ret = {
        'access_token': create_access_token(identity=username),
        'refresh_token': create_refresh_token(identity=username)
    }
    return jsonify(ret), 200



@app.route('/refresh', methods=['POST'])
@jwt_refresh_token_required
def refresh():
    current_user = get_jwt_identity()
    ret = {
        'access_token': create_access_token(identity=current_user)
    }
    return jsonify(ret), 200

@jwt.expired_token_loader
def my_expired_token_callback():
    return jsonify({
        'status': 401,
        'sub_status': 101,
        'msg': 'The token has expired'
    }), 401






# Get all cameras
@app.route('/camera', methods=['GET',])
def get_camera():
    camera_list = {}
    #current_user = get_jwt_identity()
    try:
        conn = db.get_db()
        cur = conn.cursor()

        cur.execute("SELECT COUNT(*) FROM MEASUREMENTS")
        total_measurements = cur.fetchone()["count"]
        
        if True:
            cur.execute("SELECT CameraID, description, lat, lon FROM CAMERAS")
            data = cur.fetchall()
            for row in data:
                camera_list[row['cameraid']] = row

            cur.execute("SELECT m.CameraID, COUNT(m.dataid) as count FROM MEASUREMENTS m GROUP BY m.CameraID")
            data = cur.fetchall()
            for row in data:
                camera_list[row['cameraid']]['measurement_count'] = row['count']
        else:
            cur.execute("SELECT * FROM CAMERAS")
            data = cur.fetchall()
            for row in data:
                camera_list.append(row)
            
            for camera in camera_list:
                camera_id = camera['cameraid']
                cur.execute("SELECT COUNT(*) FROM MEASUREMENTS WHERE CameraID = %s", (camera_id,))
                num = cur.fetchone()
                camera['measurement_count'] = num

        conn.commit()
        cur.close()
    except Exception as e:
        app.logger.exception("Database Error {}".format(e))
        return jsonify({"msg": "Database Error {}".format(e)}), 400

    ret = {
        'camera_list': camera_list,
        'total_measurements': total_measurements
    }
    return jsonify(ret), 200

# Get all cameras
@app.route('/camera/<int:camera_id>', methods=['GET',])
def get_camera_id(camera_id):
    ret = {}
    try:
        conn = db.get_db()
        cur = conn.cursor()
        '''    CameraID      BIGINT        NOT NULL,
    description   VARCHAR(255)  NOT NULL,
    lat           FLOAT,
    lon           FLOAT,
        '''
        cur.execute("SELECT * FROM CAMERAS WHERE CameraID = %s", (camera_id,))
        res  = cur.fetchone()
        if res is None:
            app.logger.error("Unknown Camera {}".format(camera_id))
            return jsonify({"msg": "Unknown Camera {}".format(camera_id)}), 400
        
        ret["description"] = res['description']
        ret["lat"] = res['lat']
        ret["lon"] = res['lon']
        
        cur.execute("SELECT COUNT(*) FROM MEASUREMENTS WHERE CameraID = %s", (camera_id,))
        res = cur.fetchone()
        ret['measurement_count'] = res['count']

        cur.close()
        conn.commit()
    except Exception as e:
        app.logger.exception("Database Error {}".format(e))
        return jsonify({"msg": "Database Error {}".format(e)}), 400

    return jsonify(ret), 200


@app.route('/camera/<int:camera_id>', methods=['POST',])
@jwt_required
def post_camera_info(camera_id):
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400
    app.logger.info("New camera id={}, info={}".format(camera_id, request.json))
    try:
        in_camera_info = request.json['info']
        desc = in_camera_info['description']
        lat = in_camera_info['lat']
        lon = in_camera_info['lon']
    except Exception as e:
        app.logger.exception(e)
        app.logger.info("Missing required camera parameter {}".format(request.json))
        return jsonify({"msg": "Missing required camera parameter {}".format(e)}), 400

    try:
        conn = db.get_db()
        cur = conn.cursor()
        cur.execute("UPDATE CAMERAS SET description = %s, lat = %s, lon = %s WHERE CameraID = %s", (desc, lat, lon, camera_id,))
        conn.commit()
        cur.close()
    except Exception as e:
        app.logger.exception("Database Error {}".format(e))
        return jsonify({"msg": "Database Error {}".format(e)}), 400

    ret = {
        'added_info': desc
    }
    return jsonify(ret), 200







# Get all measurementes from a certain camera
@app.route('/measurement/<int:camera_id>', methods=['GET',])
@jwt_required
def get_measurement(camera_id):
    measurement_list = []
    app.logger.info("Get Measurements from camera_id={}, info={}".format(camera_id, request.json))
    #current_user = get_jwt_identity()
    try:
        conn = db.get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM MEASUREMENTS WHERE CameraID = %s", (camera_id,))
        data = cur.fetchall()
        for row in data:
            measurement_list.append(row)
        conn.commit()
        cur.close()
    except Exception as e:
        app.logger.exception("Database Error {}".format(e))
        return jsonify({"msg": "Database Error {}".format(e)}), 400

    ret = {
        'measurement_list': measurement_list
    }
    return jsonify(ret), 200


# Upload a measurement to a certain camera
@app.route('/measurement/<int:camera_id>', methods=['POST',])
@jwt_required
def post_measurement(camera_id):
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400
    app.logger.info("New Measurement camera_id={}, info={}".format(camera_id, request.json))
    
    try:
        in_measurement_list = request.json['measurement_list']
        value_list = []
        
        '''
            DataID                SERIAL         NOT NULL,
            CameraID              BIGINT         NOT NULL,
            DateTime              TIMESTAMP       NOT NULL,
            n_car                INTEGER       NOT NULL,
            n_bicycle                INTEGER       NOT NULL,
            n_truck                INTEGER       NOT NULL,
            n_bus                INTEGER       NOT NULL,
            n_motorbike                INTEGER       NOT NULL,
            n_person  
        '''
        for measurement in in_measurement_list:
            timestamp = dateutil.parser.parse(measurement['timestamp'])
            car = measurement['car']
            bicycle = measurement['bicycle']
            truck = measurement['truck']
            bus = measurement['bus']
            motorbike = measurement['motorbike']
            person = measurement['person']
            
            value_list.append((camera_id, timestamp, car, 
                    bicycle, truck, bus,
                    motorbike, person,))
    except Exception as e:
        app.logger.exception(e)
        app.logger.info("Missing required measurement parameter {}".format(request.json))
        return jsonify({"msg": "Missing required measurement parameter {}".format(e)}), 400

    try:
        conn = db.get_db()
        cur = conn.cursor()
        app.logger.info("Value List {}".format(value_list))
        cur.execute("INSERT INTO CAMERAS (CameraID, description, lat, lon) VALUES(%s, %s, %s, %s) ON CONFLICT DO NOTHING", (camera_id, "default", -1, -1,))

        cur.executemany("INSERT INTO MEASUREMENTS VALUES(DEFAULT,%s,%s,%s,%s,%s,%s,%s,%s)", value_list)
        conn.commit()
        cur.close()
    except Exception as e:
        app.logger.exception("Database Error {}".format(e))
        return jsonify({"msg": "Database Error {}".format(e)}), 400

    ret = {
        'created_measurement': camera_id
    }
    return jsonify(ret), 200



# Generic Status Route
@app.route('/status', methods=['GET',])
@jwt_required
def get_status():
    # Access the identity of the current user with get_jwt_identity
    current_user = get_jwt_identity()
    return jsonify(logged_in_as=current_user), 200


if __name__ == '__main__':
    app.run()
